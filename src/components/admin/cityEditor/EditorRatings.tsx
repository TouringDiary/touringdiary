
import React, { useState, useMemo } from 'react';
import { BarChart3, Eye, Loader2, RefreshCw } from 'lucide-react';
import { useCityEditor } from '../../../context/CityEditorContext';
import { generateCitySection } from '../../../services/ai';
import { AiFieldHelper } from '../AiFieldHelper';
import { saveCityDetails } from '../../../services/cityService';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

const RATING_LABELS: Record<string, string> = {
    cultura: 'Cultura Generale', monumenti: 'Monumenti', musei_arte: 'Musei & Arte', tradizione: 'Storia & Tradizione', architettura: 'Architettura',
    natura: 'Natura', mare_spiagge: 'Mare & Spiagge', paesaggi: 'Paesaggi', clima: 'Clima', sostenibilita: 'Sostenibilità',
    gusto: 'Gusto', cucina: 'Cucina Locale', vita_notturna: 'Vita Notturna', caffe_bar: 'Caffè & Bar', mercati: 'Mercati',
    viaggiatore: 'Vibe Viaggiatore', mobilita: 'Mobilità', accoglienza: 'Accoglienza', costo: 'Qualità/Prezzo', sicurezza: 'Sicurezza'
};

const RATING_CATEGORIES = [
    { title: 'Cultura & Storia', color: 'emerald', keys: ['cultura', 'monumenti', 'musei_arte', 'tradizione', 'architettura'] },
    { title: 'Natura & Paesaggio', color: 'emerald', keys: ['natura', 'mare_spiagge', 'paesaggi', 'clima', 'sostenibilita'] },
    { title: 'Gusto & Vita', color: 'emerald', keys: ['gusto', 'cucina', 'vita_notturna', 'caffe_bar', 'mercati'] },
    { title: 'Viaggio & Servizi', color: 'emerald', keys: ['viaggiatore', 'mobilita', 'accoglienza', 'costo', 'sicurezza'] }
];

const DEFAULT_RATINGS = { 
    cultura: 50, monumenti: 50, musei_arte: 50, tradizione: 50, architettura: 50,
    natura: 50, mare_spiagge: 50, paesaggi: 50, clima: 50, sostenibilita: 50,
    gusto: 50, cucina: 50, vita_notturna: 50, caffe_bar: 50, mercati: 50,
    viaggiatore: 50, mobilita: 50, accoglienza: 50, costo: 50, sicurezza: 50
};

export const EditorRatings = () => {
    const { city, setCityDirectly, triggerPreview, updateField, updateDetailField, reloadCurrentCity } = useCityEditor();
    const [generating, setGenerating] = useState(false);
    const [ratingInstructions, setRatingInstructions] = useState('');
    const [showConfirmRegen, setShowConfirmRegen] = useState(false);

    // CALCOLO LIVE PER VISUALIZZAZIONE
    // Non aggiorniamo lo state 'city.rating' qui per evitare loop o doppi aggiornamenti.
    // Il valore nel DB sarà calcolato e salvato dal servizio 'saveCityDetails'.
    const liveRating = useMemo(() => {
        if (!city?.details?.ratings) return 0;
        const ratings = city.details.ratings as unknown as Record<string, number>;
        const values = Object.values(ratings);
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        const avg100 = sum / values.length;
        return parseFloat(((avg100 / 100) * 5).toFixed(1));
    }, [city?.details?.ratings]);

    if (!city) return null;

    const handleRegeneratePage = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!city.name) { 
            alert("Inserisci il nome della città prima di generare."); 
            return; 
        }

        setShowConfirmRegen(true);
    };

    const executeRegeneratePage = async () => {
        setShowConfirmRegen(false);
        setGenerating(true);
        
        try {
            // 1. Prepare Defaults
            const resetRatings = { ...DEFAULT_RATINGS };
            
            // 2. Generate with AI
            console.log("Avvio generazione AI ratings per:", city.name);
            const data = await generateCitySection(city.name, 'ratings', ratingInstructions);
            
            if (!data || !data.ratings) {
                throw new Error("L'AI non ha restituito dati validi. Riprova.");
            }

            // 3. Update Local Object
            const newCity = { ...city };
            newCity.details.ratings = { ...resetRatings, ...data.ratings };
            
            // Il rating globale viene calcolato automaticamente al salvataggio nel service
            // ma lo impostiamo qui per coerenza visiva immediata
            // (Nota: il service sovrascriverà comunque per sicurezza)

            // 4. Save to DB (Service will enforce the math)
            console.log("Salvataggio DB...");
            await saveCityDetails(newCity);
            
            // 5. Reload Context
            await reloadCurrentCity();
            
            alert("Valutazioni rigenerate con successo!");
            triggerPreview('ratings', 'Punteggi');

        } catch (error: any) {
            console.error("Errore rigenerazione:", error);
            alert(`Errore durante la generazione: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const updateRatingValue = (category: string, value: number) => {
        const currentRatings = { ...city.details.ratings };
        (currentRatings as any)[category] = value;
        updateDetailField('ratings', currentRatings);
    };

    return (
        <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl animate-in fade-in">
             <DeleteConfirmationModal 
                isOpen={showConfirmRegen}
                onClose={() => setShowConfirmRegen(false)}
                onConfirm={executeRegeneratePage}
                title="Rigenera Valutazioni"
                message="ATTENZIONE: Verranno sovrascritti tutti i punteggi attuali con nuovi dati AI. Continuare?"
                confirmLabel="Rigenera"
            />
             {/* ACTION BAR RIGENERA */}
            <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-800 pb-4">
                <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 md:w-7 md:h-7 text-emerald-500"/> Valutazioni</h3>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex flex-col items-end">
                        <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase">MEDIA LIVE</span>
                        <span className={`text-lg md:text-2xl font-black leading-none ${liveRating !== city.rating ? 'text-amber-500 animate-pulse' : 'text-white'}`}>
                            {liveRating.toFixed(1)}
                        </span>
                    </div>
                     <button onClick={() => triggerPreview('ratings', 'Punteggi')} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 text-xs md:text-sm"><Eye className="w-3.5 h-3.5"/> <span className="hidden md:inline">Anteprima</span></button>
                    <button 
                        onClick={handleRegeneratePage} 
                        disabled={generating} 
                        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-xs uppercase tracking-wide border border-rose-500 shadow-lg transition-all active:scale-95"
                    >
                        {generating ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>} 
                        {generating ? 'ANALISI...' : 'RIGENERA PAGINA'}
                    </button>
                </div>
            </div>

            <div className="mb-8 p-4 bg-slate-950/50 border border-purple-500/20 rounded-xl">
                 <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 block">Strategia AI</label>
                 <AiFieldHelper 
                    contextLabel="strategia di valutazione"
                    onApply={(val) => setRatingInstructions(val)}
                    mode="text"
                    currentValue={ratingInstructions}
                    initialPrompt="Es. Sii severo sui trasporti ma generoso sul cibo"
                    fieldId="ratings_strategy"
                    isStrategyConfig={true} 
                />
                {ratingInstructions && <div className="mt-2 text-xs text-purple-200 italic border-l-2 border-purple-500 pl-2">Strategia: "{ratingInstructions}"</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {RATING_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-5 md:p-6 rounded-2xl border border-slate-800">
                        <h4 className="text-emerald-500 font-bold uppercase tracking-widest text-xs md:text-sm mb-4 border-b border-emerald-900/30 pb-2">{cat.title}</h4>
                        <div className="space-y-4">
                            {cat.keys.map(key => (
                                <div key={key}>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span className="uppercase truncate max-w-[70%]">{RATING_LABELS[key] || key.replace('_', ' ')}</span>
                                        <span className="text-white">{(city.details.ratings as any)[key] || 0}</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={(city.details.ratings as any)[key] || 0} 
                                        onChange={e => updateRatingValue(key, parseInt(e.target.value))} 
                                        className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-4 text-center text-slate-500 text-[10px] italic">
                * La media generale (rating) verrà aggiornata e sincronizzata automaticamente nel database al momento del salvataggio.
            </div>
        </div>
    );
};
