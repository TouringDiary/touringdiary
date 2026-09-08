import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Flag,
  Globe,
  RotateCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Utensils,
} from 'lucide-react';
import type React from 'react';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import type { PointOfInterest } from '@/types';
import { useShare } from '../../../hooks/useShare';
import { affiliateTrackingService } from '../../../services/affiliateTrackingService';
import { enrichAffiliateUrl, type PartnerType } from '../../../utils/affiliateNetwork';

interface PoiInfoSectionProps {
  poi: PointOfInterest;
  onSuggestEdit?: (poiName: string) => void;
}

// Badge Prezzo Compatto - Updated Border to Gold/Amber
type PoiPriceLevel = NonNullable<PointOfInterest['priceLevel']>;

const isPoiPriceLevel = (value: PointOfInterest['priceLevel']): value is PoiPriceLevel =>
  value === 1 || value === 2 || value === 3 || value === 4;

const PRICE_LEVEL_SLOTS = [1, 2, 3, 4] as const satisfies readonly PoiPriceLevel[];
const PRICE_LEVEL_LABELS: Record<PoiPriceLevel, string> = {
  1: 'Economico',
  2: 'Medio',
  3: 'Caro',
  4: 'Lusso',
};

const PriceHeaderBadge = ({ level }: { level: PoiPriceLevel }) => {
  return (
    <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-0.5 shadow-sm">
      <span className="text-amber-500 font-mono font-bold tracking-widest text-[10px]">
        {PRICE_LEVEL_SLOTS.map((slot) => (
          <span key={slot} className={slot <= level ? 'text-amber-500' : 'text-slate-700'}>
            €
          </span>
        ))}
      </span>
      <div className="w-px h-2.5 bg-slate-700"></div>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">
        {PRICE_LEVEL_LABELS[level]}
      </span>
    </div>
  );
};

export const PoiInfoSection = ({ poi, onSuggestEdit }: PoiInfoSectionProps) => {
  const filterSectionLabel10Style = useDynamicStyles('filter_section_title', true);
  const { share } = useShare();
  const affiliateBtnClass =
    'flex min-h-11 w-full items-center justify-between rounded-lg border p-2 text-[10px] font-bold uppercase tracking-wide transition-all lg:min-h-0';

  const hasBookableLinks = Boolean(
    poi.affiliate?.booking ||
      poi.affiliate?.tripadvisor ||
      poi.affiliate?.thefork ||
      poi.affiliate?.getyourguide ||
      poi.contactInfo?.website,
  );

  const handleAffiliateClick = (e: React.MouseEvent, partner: PartnerType, rawUrl: string) => {
    e.stopPropagation();

    // Nuovo tracking centralizzato
    affiliateTrackingService.trackClickOut({
      partnerId: partner,
      sourceType: 'poi',
      category: 'poi_booking',
      poiId: poi.id,
      cityId: poi.cityId || undefined,
    });

    window.open(enrichAffiliateUrl(rawUrl, partner), '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    share({
      title: poi.name,
      text: `Scopri ${poi.name} su Touring Diary! ${poi.description.substring(0, 100)}...`,
      params: { city: poi.cityId || 'napoli', poi: poi.id },
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
    if (!poi.openingHours)
      return (
        <div className="text-slate-600 text-xs italic text-center py-2">Orari non disponibili.</div>
      );

    const { days = [], morning, afternoon, isEstimated } = poi.openingHours;
    const timeParts = [morning, afternoon].filter((part): part is string => Boolean(part));
    const timeStr = timeParts.join(' / ');

    // CHECK "CHIUSO PERMANENTEMENTE"
    // Se il testo contiene "chiuso permanentemente", ignoriamo l'array dei giorni e marchiamo tutto chiuso.
    const isPermanentlyClosed =
      morning?.toLowerCase().includes('chiuso permanentemente') ||
      afternoon?.toLowerCase().includes('chiuso permanentemente');

    const weekDaysList = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'];
    const weekendDaysList = ['Sab', 'Dom'];

    // Se permanentemente chiuso, nessun giorno è attivo
    const activeDays = isPermanentlyClosed ? [] : Array.isArray(days) ? days : [];

    const isWeekdayOpen = !isPermanentlyClosed && weekDaysList.some((d) => activeDays.includes(d));
    const isWeekendOpen =
      !isPermanentlyClosed && weekendDaysList.some((d) => activeDays.includes(d));

    const hasNoActiveDays = !isPermanentlyClosed && !isWeekdayOpen && !isWeekendOpen;

    const getHourBoxTimeLabel = () => {
      if (isPermanentlyClosed) return 'CHIUSO PERMANENTEMENTE';
      if (hasNoActiveDays) return 'Non verificato';
      return timeStr || 'Chiuso';
    };

    const hourBoxTimeLabel = getHourBoxTimeLabel();

    // Helper per classi colori PILLOLE GIORNI
    // Verde = Aperto, Rosso Tenue = Chiuso (Meno aggressivo)
    const getPillClass = (isActiveDay: boolean) => {
      if (isActiveDay) return 'bg-emerald-600 border-emerald-500 text-white shadow-sm'; // APERTO
      return 'bg-red-900/40 border-red-800 text-red-200'; // CHIUSO (Rosso Tenue)
    };

    const HourBox = ({ title, dayList }: { title: string; dayList: string[] }) => (
      // FIX SCROLLBAR & ALIGNMENT:
      // pt-3: Mantenuto per distanziare giorni da header (come richiesto)
      // pb-1.5: Ridotto per alzare il bordo inferiore (previene scroll)
      <div className="relative border border-slate-800 rounded-lg px-2 pt-3 pb-1.5 mt-2.5 bg-[#0f172a]">
        {/* Header Riga in Sovraimpressione per risparmiare spazio */}
        <span className="absolute -top-1.5 left-2 bg-slate-950 px-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none z-floating-panel">
          {title}
        </span>

        {/* Giorni a Pillola */}
        {/* mb-1.5: Ridotto leggermente per avvicinare il testo sotto senza toccarlo, salvando pixel verticali */}
        <div className="flex gap-0.5 mb-1.5">
          {dayList.map((d) => {
            const isActiveDay = activeDays.includes(d);
            return (
              <div
                key={d}
                className={`flex-1 h-5 flex items-center justify-center rounded text-[8px] font-bold transition-colors border ${getPillClass(isActiveDay)}`}
              >
                {d}
              </div>
            );
          })}
        </div>

        {/* Orario */}
        <div className="text-center">
          <span
            className={`font-bold text-[10px] leading-tight ${
              isPermanentlyClosed
                ? 'font-mono text-red-500'
                : hasNoActiveDays
                  ? 'text-slate-400 uppercase tracking-wide'
                  : 'font-mono text-slate-300'
            }`}
          >
            {hourBoxTimeLabel}
          </span>
        </div>
      </div>
    );

    // LOGICA VISUALIZZAZIONE DATA VERIFICA
    // Se c'è una data specifica lastVerified, usiamo quella.
    // Se non c'è ma il flag isEstimated è false, usiamo updatedAt.
    // Se isEstimated è true e non c'è lastVerified, mostriamo "Orario Stimato".

    let verificationBadge = null;

    if (hasNoActiveDays) {
      verificationBadge = (
        <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-600/40 uppercase tracking-wide">
          <AlertTriangle className="w-3 h-3" /> Non verificato
        </span>
      );
    } else if (poi.lastVerified) {
      // Caso ideale: Abbiamo la data precisa di verifica
      verificationBadge = (
        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
          <CheckCircle className="w-3 h-3" /> Verificato il{' '}
          {formatVerificationDate(poi.lastVerified)}
        </span>
      );
    } else if (isEstimated) {
      // Caso bozza / AI veloce
      verificationBadge = (
        <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-900/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse uppercase tracking-wide">
          <AlertTriangle className="w-3 h-3" /> Orario Stimato (Verificare)
        </span>
      );
    } else {
      // Caso legacy o manuale senza data specifica (Fallback su UpdatedAt)
      const displayDate = poi.updatedAt ? formatVerificationDate(poi.updatedAt) : 'Recentemente';
      verificationBadge = (
        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
          <CheckCircle className="w-3 h-3" /> Verificato: {displayDate}
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
          <div className="flex justify-center">{verificationBadge}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto custom-scrollbar bg-slate-900 px-5 pb-5 pt-10 md:px-6 md:pb-6 md:pt-12 lg:h-auto lg:overflow-visible lg:pb-4 lg:pt-4">
      {/* GRID STRUCTURE */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start lg:gap-4">
        {/* LEFT: DESCRIPTION & TIPS */}
        <div className="flex flex-col lg:col-span-2">
          <div className="space-y-4 lg:space-y-3">
            <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1 lg:mb-1">
              <h4 className={filterSectionLabel10Style}>Descrizione</h4>
              <button
                type="button"
                onClick={handleShare}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-[10px] font-bold uppercase text-indigo-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 lg:min-h-0 lg:px-0"
              >
                <Share2 className="w-3 h-3" aria-hidden /> Condividi
              </button>
            </div>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-serif text-justify whitespace-pre-line">
              {poi.fullDescription || poi.description}
            </p>

            {poi.tips && (
              <div className="bg-amber-900/10 border-l-4 border-amber-500 p-3 rounded-r-xl shadow-lg">
                <h5 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Consiglio Local
                </h5>
                <p className="text-slate-200 italic text-xs">"{poi.tips}"</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: INFO BOX & AFFILIATES (Compact) */}
        <div className="flex h-full flex-col space-y-3 lg:h-auto lg:space-y-2">
          {/* INFO BOX - VIA DI MEZZO: p-3 */}
          <div className="bg-slate-950/30 rounded-xl border border-slate-800 p-3 shadow-inner">
            {/* HEADER BOX - VIA DI MEZZO: mb-2.5 pb-2 */}
            <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-800/50">
              <h4 className="text-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Info Rapide
              </h4>
              {isPoiPriceLevel(poi.priceLevel) ? (
                <PriceHeaderBadge level={poi.priceLevel} />
              ) : (
                <span className="text-[9px] text-slate-600 font-bold uppercase">Prezzo N/D</span>
              )}
            </div>

            {renderOpeningHoursBoxes()}
          </div>

          <div className="space-y-2 border-t border-slate-800/50 pt-3 text-slate-500 lg:hidden">
            <div className="flex items-start gap-2 text-[9px] leading-snug">
              <ShieldCheck className="h-4 w-4 shrink-0 opacity-50" />
              <p className="min-w-0 flex-1">
                Scheda informativa creata tramite IA e contributi community. I dati potrebbero non
                essere aggiornati. Touring Diary non è affiliato con questa struttura se non
                indicato come Sponsor.
              </p>
            </div>
            {!poi.isSponsored && onSuggestEdit && (
              <button
                type="button"
                onClick={() => onSuggestEdit(poi.name)}
                className="flex min-h-11 w-fit items-center gap-2 rounded-lg border border-indigo-500/30 px-3 py-1.5 text-[10px] font-bold uppercase text-indigo-400 transition-colors hover:bg-indigo-900/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              >
                <Flag className="h-3 w-3" aria-hidden /> Segnala / Rivendica
              </button>
            )}
          </div>

          {hasBookableLinks && (
            <div className="space-y-1.5 mt-auto pt-2">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">
                Prenota Ora
              </h4>
              {poi.affiliate?.booking && (
                <button
                  type="button"
                  onClick={(e) => handleAffiliateClick(e, 'booking', poi.affiliate!.booking!)}
                  className={`${affiliateBtnClass} bg-[#003580] text-white shadow-md border-white/10 hover:bg-[#0048a8]`}
                >
                  <span>Booking.com</span>
                  <Ticket className="w-3.5 h-3.5" />
                </button>
              )}
              {poi.affiliate?.tripadvisor && (
                <button
                  type="button"
                  onClick={(e) =>
                    handleAffiliateClick(e, 'tripadvisor', poi.affiliate!.tripadvisor!)
                  }
                  className={`${affiliateBtnClass} bg-[#00AA6C] text-white shadow-md border-white/10 hover:bg-[#00c980]`}
                >
                  <span>TripAdvisor</span>
                  <Globe className="w-3.5 h-3.5" />
                </button>
              )}
              {poi.affiliate?.thefork && (
                <button
                  type="button"
                  onClick={(e) => handleAffiliateClick(e, 'thefork', poi.affiliate!.thefork!)}
                  className={`${affiliateBtnClass} bg-[#58902d] text-white shadow-md border-white/10 hover:bg-[#6fb338]`}
                >
                  <span>TheFork</span>
                  <Utensils className="w-3.5 h-3.5" />
                </button>
              )}
              {poi.affiliate?.getyourguide && (
                <button
                  type="button"
                  onClick={(e) =>
                    handleAffiliateClick(e, 'getyourguide', poi.affiliate!.getyourguide!)
                  }
                  className={`${affiliateBtnClass} bg-[#FF5533] text-white shadow-md border-white/10 hover:bg-[#ff7755]`}
                >
                  <span>GetYourGuide</span>
                  <Ticket className="w-3.5 h-3.5" />
                </button>
              )}
              {poi.contactInfo?.website && (
                <button
                  type="button"
                  onClick={(e) => handleAffiliateClick(e, 'website', poi.contactInfo!.website!)}
                  className={`${affiliateBtnClass} border-slate-700 bg-slate-800 text-slate-300 shadow-md hover:bg-slate-700`}
                >
                  <span>Sito Ufficiale</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop: scheda informativa full-width sotto entrambe le colonne */}
        <div className="hidden min-w-0 flex-col gap-4 border-t border-slate-800 pt-6 text-slate-500 lg:col-span-3 lg:flex lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:pt-3">
          <div className="flex min-w-0 flex-1 items-start gap-2 text-[9px] leading-snug">
            <ShieldCheck className="h-4 w-4 shrink-0 opacity-50" />
            <p>
              Scheda informativa creata tramite IA e contributi community. I dati potrebbero non
              essere aggiornati. Touring Diary non è affiliato con questa struttura se non indicato
              come Sponsor.
            </p>
          </div>

          {!poi.isSponsored && onSuggestEdit && (
            <button
              type="button"
              onClick={() => onSuggestEdit(poi.name)}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-indigo-500/30 px-3 py-1.5 text-[10px] font-bold uppercase text-indigo-400 transition-colors hover:bg-indigo-900/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <Flag className="h-3 w-3" aria-hidden /> Segnala / Rivendica
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
