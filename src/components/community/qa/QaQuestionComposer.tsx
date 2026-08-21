import { ChevronDown, Loader2, MapPin, Send } from 'lucide-react';
import type { CitySummary } from '../../../types/index';
import { QaAuthGate } from './QaAuthGate';
import { QA_GENERAL_CITY_LABEL } from './qaForumShared';

interface QaQuestionComposerProps {
  qaEnabled: boolean;
  isGuest: boolean;
  pausedTitle: string;
  pausedBody: string;
  questionText: string;
  questionCity: string;
  isPostingQa: boolean;
  cityManifest: CitySummary[];
  onRequireAuth: () => void;
  onQuestionTextChange: (value: string) => void;
  onQuestionCityChange: (value: string) => void;
  onSubmit: () => void;
}

export const QaQuestionComposer = ({
  qaEnabled,
  isGuest,
  pausedTitle,
  pausedBody,
  questionText,
  questionCity,
  isPostingQa,
  cityManifest,
  onRequireAuth,
  onQuestionTextChange,
  onQuestionCityChange,
  onSubmit,
}: QaQuestionComposerProps) => (
  <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 shadow-xl shrink-0 animate-in fade-in slide-in-from-bottom-4">
    {!qaEnabled ? (
      <div className="space-y-2 py-1">
        <h4 className="text-amber-200 font-bold text-sm">{pausedTitle}</h4>
        <p className="text-slate-400 text-xs">{pausedBody}</p>
      </div>
    ) : isGuest ? (
      <QaAuthGate
        message="Per pubblicare una domanda in Consigli è necessario autenticarsi. Accedi o registrati per continuare."
        onRequireAuth={onRequireAuth}
      />
    ) : (
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-5">
        <div className="flex-[1_1_78%] min-w-0 flex flex-col">
          <label className="sr-only" htmlFor="qa-new-question">
            Scrivi la tua domanda
          </label>
          <textarea
            id="qa-new-question"
            value={questionText}
            onChange={(e) => onQuestionTextChange(e.target.value)}
            placeholder="Dubbi su trasporti, cibo o luoghi? Chiedi ai viaggiatori consigli ed esperienze."
            className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none resize-none min-h-[7.5rem] lg:min-h-[6.5rem] placeholder:text-slate-500 transition-all focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
        <div className="flex flex-col gap-3 lg:flex-[0_1_22%] lg:min-w-[9.5rem] lg:max-w-[11.5rem] w-full shrink-0">
          <div className="relative group">
            <label className="sr-only" htmlFor="qa-new-city">
              Scegli la città (obbligatorio)
            </label>
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 pointer-events-none"
              aria-hidden
            />
            <select
              id="qa-new-city"
              value={questionCity}
              onChange={(e) => onQuestionCityChange(e.target.value)}
              required
              className={`w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-9 text-xs font-bold uppercase tracking-wide focus:border-indigo-500 outline-none cursor-pointer appearance-none hover:bg-slate-900 transition-colors min-h-11 [&>option]:bg-slate-950 [&>option]:text-slate-100 ${questionCity ? 'text-white' : 'text-transparent group-focus-within:text-white'}`}
            >
              <option value="">Scegli la città</option>
              {cityManifest.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="general">{QA_GENERAL_CITY_LABEL}</option>
            </select>
            {!questionCity && (
              <span
                className="absolute left-10 right-9 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-bold text-white uppercase tracking-wide truncate group-focus-within:opacity-0 group-focus-within:invisible"
                aria-hidden
              >
                Scegli la città <span className="text-red-500">*</span>
              </span>
            )}
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none"
              aria-hidden
            />
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!questionText.trim() || !questionCity || isPostingQa}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] min-h-11 mt-auto"
          >
            {isPostingQa ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Send className="w-4 h-4" aria-hidden />
            )}
            Pubblica
          </button>
        </div>
      </div>
    )}
  </div>
);
