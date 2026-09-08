import { Camera, Flag, Lightbulb } from 'lucide-react';

interface CultureCornerCommunityProps {
  onSuggestPerson: () => void;
  onSuggestPhoto?: () => void;
  onReportAbuse?: () => void;
  hasSelectedPerson?: boolean;
  hasSelectedPersonImage?: boolean;
  showExtraActions?: boolean;
}

export const CultureCornerCommunity = ({
  onSuggestPerson,
  onSuggestPhoto,
  onReportAbuse,
  hasSelectedPerson = false,
  hasSelectedPersonImage = false,
  showExtraActions = false,
}: CultureCornerCommunityProps) => {
  return (
    <div className="mt-auto pt-12 md:pt-16 shrink-0">
      <div className="border-t border-slate-800/80 pt-4 space-y-1.5">
        <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
          <p>
            Le immagini sono fornite dagli utenti, che dichiarano di detenerne i diritti o le
            necessarie autorizzazioni per il loro utilizzo.
          </p>
          <p>
            TouringDiary non garantisce la titolarità dei diritti, per eventuali violazioni,
            utilizza &quot;Segnala abuso&quot;.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
          <button
            type="button"
            onClick={onSuggestPerson}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-500/90 hover:text-amber-400 transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          >
            <Lightbulb className="w-3.5 h-3.5" aria-hidden />
            Consiglia un personaggio
          </button>

          {showExtraActions && onSuggestPhoto ? (
            <button
              type="button"
              onClick={onSuggestPhoto}
              disabled={!hasSelectedPerson}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-500/90 hover:text-amber-400 transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-amber-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
              title={
                hasSelectedPerson
                  ? 'Suggerisci una nuova foto ufficiale'
                  : 'Seleziona un personaggio per suggerire una foto'
              }
              aria-label={
                hasSelectedPerson
                  ? 'Suggerisci una nuova foto ufficiale'
                  : 'Suggerisci foto (Seleziona prima un personaggio)'
              }
            >
              <Camera className="w-3.5 h-3.5" aria-hidden />
              Suggerisci foto
            </button>
          ) : null}

          {showExtraActions && onReportAbuse ? (
            <button
              type="button"
              onClick={onReportAbuse}
              disabled={!hasSelectedPerson || !hasSelectedPersonImage}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
              title={
                hasSelectedPersonImage
                  ? 'Segnala abuso sulla foto ufficiale pubblicata'
                  : 'Nessuna foto ufficiale pubblicata da segnalare'
              }
              aria-label={
                hasSelectedPersonImage
                  ? 'Segnala abuso sulla foto ufficiale pubblicata'
                  : 'Segnala abuso (Nessuna foto ufficiale pubblicata da segnalare)'
              }
            >
              <Flag className="w-3.5 h-3.5" aria-hidden />
              Segnala abuso
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
