
import React from 'react';
import { Sparkles, ShieldCheck, Flag, Clock, Ticket, Globe, RotateCw, CheckCircle, XCircle, Share2, Utensils, AlertTriangle, Info, Check } from 'lucide-react';
import { PointOfInterest } from '../../../types/index';
import { enrichAffiliateUrl } from '../../../utils/affiliateNetwork';
import { trackAffiliateClick } from '../../../services/trackingService';
import { useShare } from '../../../hooks/useShare';

interface PoiInfoSectionProps {
    poi: PointOfInterest;
    onSuggestEdit?: (poiName: string) => void;
}

// Badge Prezzo Compatto - Updated Border to Gold/Amber
const PriceHeaderBadge = ({ level }: { level: number }) => {
    const labels = ["Economico", "Medio", "Caro", "Lusso"];
    return (
        <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-0.5 shadow-sm">
            <span className="text-amber-500 font-mono font-bold tracking-widest text-[10px]">
                {[...Array(level)].map((_, i) => <span key={i}>€</span>)}
                <span className="text-slate-700">{[...Array(4-level)].map((_, i) => <span key={i}>€</span>)}</span>
            </span>
            <div className="w-px h-2.5 bg-slate-700"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">
                {labels[level - 1]}
            </span>
        </div>
    );
};

export const PoiInfoSection = ({ poi, onSuggestEdit }: PoiInfoSectionProps) => {
    const { share } = useShare();
    
    const handleAffiliateClick = (e: React.MouseEvent, partner: any, rawUrl: string) => {
        e.stopPropagation(); 
        trackAffiliateClick(poi.id, poi.name, partner);
        window.open(enrichAffiliateUrl(rawUrl, partner), '_blank', 'noopener,noreferrer');
    };

    const handleShare = () => {
        share({
            title: poi.name,
            text: `Scopri ${poi.name} su Touring Diary! ${poi.description.substring(0, 100)}...`,
            params: { city: poi.cityId || 'napoli', poi: poi.id }
        });
    };
    
    // FORMAT DATE HELPER (DD/MM/YYYY)
    const formatVerificationDate = (isoStr?: string) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // --- RENDERIZZA I BOX ORARI CON LOGICA STATO APERTO/CHIUSO SEPARATA DALLA QUALITÀ DATO ---
    const renderOpeningHoursBoxes = () => {
        if (!poi.openingHours) return <div className="text-slate-600 text-xs italic text-center py-2">Orari non disponibili.</div>;

        const { days = [], morning, afternoon, isEstimated } = poi.openingHours; 
        const timeStr = morning + (afternoon ? ` / ${afternoon}` : '');
        
        // CHECK "CHIUSO PERMANENTEMENTE"
        // Se il testo contiene "chiuso permanentemente", ignoriamo l'array dei giorni e marchiamo tutto chiuso.
        const isPermanentlyClosed = 
            (morning && morning.toLowerCase().includes('chiuso permanentemente')) || 
            (afternoon && afternoon.toLowerCase().includes('chiuso permanentemente')) ||
            (timeStr.toLowerCase().includes('chiuso permanentemente'));

        const weekDaysList = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'];
        const weekendDaysList = ['Sab', 'Dom'];

        // Se permanentemente chiuso, nessun giorno è attivo
        const activeDays = isPermanentlyClosed ? [] : (Array.isArray(days) ? days : []);

        const isWeekdayOpen = !isPermanentlyClosed && weekDaysList.some(d => activeDays.includes(d));
        const isWeekendOpen = !isPermanentlyClosed && weekendDaysList.some(d => activeDays.includes(d));
        
        // Helper per classi colori PILLOLE GIORNI
        // Verde = Aperto, Rosso Tenue = Chiuso (Meno aggressivo)
        const getPillClass = (isActiveDay: boolean) => {
             if (isActiveDay) return 'bg-emerald-600 border-emerald-500 text-white shadow-sm'; // APERTO
             return 'bg-red-900/40 border-red-800 text-red-200'; // CHIUSO (Rosso Tenue)
        };

        const HourBox = ({ title, dayList }: { title: string, dayList: string[] }) => (
            // FIX SCROLLBAR & ALIGNMENT:
            // pt-3: Mantenuto per distanziare giorni da header (come richiesto)
            // pb-1.5: Ridotto per alzare il bordo inferiore (previene scroll)
            <div className="relative border border-slate-800 rounded-lg px-2 pt-3 pb-1.5 mt-2.5 bg-[#0f172a]">
                {/* Header Riga in Sovraimpressione per risparmiare spazio */}
                <span className="absolute -top-1.5 left-2 bg-slate-950 px-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none z-10">
                    {title}
                </span>
                
                {/* Giorni a Pillola */}
                {/* mb-1.5: Ridotto leggermente per avvicinare il testo sotto senza toccarlo, salvando pixel verticali */}
                <div className="flex gap-0.5 mb-1.5">
                    {dayList.map(d => {
                        const isActiveDay = activeDays.includes(d);
                        return (
                            <div key={d} className={`flex-1 h-5 flex items-center justify-center rounded text-[8px] font-bold transition-colors border ${getPillClass(isActiveDay)}`}>
                                {d}
                            </div>
                        );
                    })}
                </div>
                
                {/* Orario */}
                <div className="text-center">
                    <span className={`font-mono text-[10px] font-bold ${isPermanentlyClosed ? 'text-red-500' : 'text-slate-300'}`}>
                        {isPermanentlyClosed ? 'CHIUSO PERMANENTEMENTE' : timeStr || 'Chiuso'}
                    </span>
                </div>
            </div>
        );
        
        // LOGICA VISUALIZZAZIONE DATA VERIFICA
        // Se c'è una data specifica lastVerified, usiamo quella.
        // Se non c'è ma il flag isEstimated è false, usiamo updatedAt.
        // Se isEstimated è true e non c'è lastVerified, mostriamo "Orario Stimato".
        
        let verificationBadge = null;
        
        if (poi.lastVerified) {
             // Caso ideale: Abbiamo la data precisa di verifica
             verificationBadge = (
                 <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
                    <CheckCircle className="w-3 h-3"/> Verificato il {formatVerificationDate(poi.lastVerified)}
                </span>
             );
        } else if (isEstimated) {
             // Caso bozza / AI veloce
             verificationBadge = (
                 <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-900/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse uppercase tracking-wide">
                    <AlertTriangle className="w-3 h-3"/> Orario Stimato (Verificare)
                </span>
             );
        } else {
             // Caso legacy o manuale senza data specifica (Fallback su UpdatedAt)
             const displayDate = poi.updatedAt ? formatVerificationDate(poi.updatedAt) : 'Recentemente';
             verificationBadge = (
                 <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
                    <CheckCircle className="w-3 h-3"/> Verificato: {displayDate}
                </span>
             );
        }

        return (
            // Flex gap-2: Ridotto da 2.5 a 2 per salvare spazio verticale ed evitare scroll
            <div className="flex flex-col gap-2">
                <HourBox title="FERIALI" dayList={weekDaysList} />
                <HourBox title="WEEKEND" dayList={weekendDaysList} />
                
                {/* LEGENDA E QUALITÀ DATO - VIA DI MEZZO: mt-1 pt-2 */}
                <div className="mt-1 pt-2 border-t border-slate-800/50 flex flex-col gap-2">
                     
                     {/* RIGA 1: LEGENDA COLORI GIORNI */}
                     <div className="flex justify-center gap-3">
                        <div className="flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-emerald-600 border border-emerald-500"></div>
                             <span className="text-[8px] text-slate-500 uppercase font-bold">Aperto</span>
                         </div>
                         <div className="flex items-center gap-1">
                             {/* Pallino Rosso Tenue per coerenza */}
                             <div className="w-2 h-2 rounded-full bg-red-900/60 border border-red-800"></div>
                             <span className="text-[8px] text-slate-500 uppercase font-bold">Chiuso</span>
                         </div>
                     </div>

                     {/* RIGA 2: INDICATORE QUALITÀ DATO (Separato) */}
                     <div className="flex justify-center">
                        {verificationBadge}
                     </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar px-5 pb-5 pt-10 md:px-6 md:pb-6 md:pt-12 bg-slate-900 flex flex-col">
            {/* GRID STRUCTURE */}
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1">
                
                {/* LEFT: DESCRIPTION & TIPS - USING FLEX-1 TO PUSH FOOTER DOWN */}
                <div className="lg:col-span-2 flex flex-col h-full justify-between">
                    <div className="space-y-4 flex-1">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrizione</h4>
                            <button onClick={handleShare} className="text-[10px] font-bold uppercase text-indigo-400 hover:text-white flex items-center gap-1 transition-colors">
                                <Share2 className="w-3 h-3"/> Condividi
                            </button>
                        </div>
                        
                        <p className="text-slate-300 text-sm md:text-base leading-relaxed font-serif text-justify whitespace-pre-line">
                            {poi.fullDescription || poi.description}
                        </p>
                        
                        {poi.tips && (
                            <div className="bg-amber-900/10 border-l-4 border-amber-500 p-3 rounded-r-xl shadow-lg">
                                <h5 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Consiglio Local</h5>
                                <p className="text-slate-200 italic text-xs">"{poi.tips}"</p>
                            </div>
                        )}
                    </div>
                    
                    {/* LEGAL DISCLAIMER & BUTTON - Pushed to bottom via justify-between/mt-auto */}
                    <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-500">
                        <div className="text-[9px] max-w-sm flex items-start gap-2 leading-snug">
                            <ShieldCheck className="w-4 h-4 shrink-0 opacity-50"/>
                            <p>
                                Scheda informativa creata tramite IA e contributi community. 
                                I dati potrebbero non essere aggiornati. Touring Diary non è affiliato con questa struttura se non indicato come Sponsor.
                            </p>
                        </div>
                        
                        {!poi.isSponsored && onSuggestEdit && (
                            <button 
                                onClick={() => onSuggestEdit(poi.name)}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase text-indigo-400 hover:text-white transition-colors border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-900/20 whitespace-nowrap"
                            >
                                <Flag className="w-3 h-3"/> Segnala o Rivendica
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT: INFO BOX & AFFILIATES (Compact) */}
                <div className="space-y-3 flex flex-col h-full">
                    
                    {/* INFO BOX - VIA DI MEZZO: p-3 */}
                    <div className="bg-slate-950/30 rounded-xl border border-slate-800 p-3 shadow-inner">
                        {/* HEADER BOX - VIA DI MEZZO: mb-2.5 pb-2 */}
                        <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-800/50">
                            <h4 className="text-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500"/> Info Rapide
                            </h4>
                            {poi.priceLevel ? <PriceHeaderBadge level={poi.priceLevel}/> : <span className="text-[9px] text-slate-600 font-bold uppercase">Prezzo N/D</span>}
                        </div>
                        
                        {renderOpeningHoursBoxes()}
                    </div>

                    {Object.keys(poi.affiliate || {}).length > 0 && (
                        <div className="space-y-1.5 mt-auto pt-2">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">Prenota Ora</h4>
                            {poi.affiliate?.booking && <button onClick={e => handleAffiliateClick(e, 'booking', poi.affiliate!.booking!)} className="w-full bg-[#003580] hover:bg-[#0048a8] text-white p-2 rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center justify-between transition-all shadow-md border border-white/10"><span>Booking.com</span><Ticket className="w-3.5 h-3.5"/></button>}
                            {poi.affiliate?.tripadvisor && <button onClick={e => handleAffiliateClick(e, 'tripadvisor', poi.affiliate!.tripadvisor!)} className="w-full bg-[#00AA6C] hover:bg-[#00c980] text-white p-2 rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center justify-between transition-all shadow-md border border-white/10"><span>TripAdvisor</span><Globe className="w-3.5 h-3.5"/></button>}
                            {poi.affiliate?.thefork && <button onClick={e => handleAffiliateClick(e, 'thefork', poi.affiliate!.thefork!)} className="w-full bg-[#58902d] hover:bg-[#6fb338] text-white p-2 rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center justify-between transition-all shadow-md border border-white/10"><span>TheFork</span><Utensils className="w-3.5 h-3.5"/></button>}
                            {poi.affiliate?.getyourguide && <button onClick={e => handleAffiliateClick(e, 'getyourguide', poi.affiliate!.getyourguide!)} className="w-full bg-[#FF5533] hover:bg-[#ff7755] text-white p-2 rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center justify-between transition-all shadow-md border border-white/10"><span>GetYourGuide</span><Ticket className="w-3.5 h-3.5"/></button>}
                            {poi.affiliate?.website && <button onClick={e => handleAffiliateClick(e, 'website', poi.affiliate!.website!)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center justify-between transition-all border border-slate-700 shadow-md"><span>Sito Ufficiale</span><RotateCw className="w-3.5 h-3.5"/></button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
