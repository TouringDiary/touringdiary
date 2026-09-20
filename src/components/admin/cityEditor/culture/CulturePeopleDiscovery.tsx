import { Check, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import type React from 'react';
import type { AiImageStepChoice } from '@/services/ai/aiImageStepConfig';
import type { PersonDiscoveryResult } from '@/services/ai/generators/peopleGenerator';

type PersonDiscoveryResultWithId = PersonDiscoveryResult & { id: string };

interface CulturePeopleDiscoveryProps {
  aiContextQuery: string;
  setAiContextQuery: (val: string) => void;
  discoveryCount: number;
  setDiscoveryCount: (val: number) => void;
  isDiscovering: boolean;
  discoveryResults: PersonDiscoveryResultWithId[];
  runDiscovery: (query: string, count: number) => void;
  importDiscoveryPerson: (person: PersonDiscoveryResultWithId) => void;
  removeDiscoveryResult: (id: string) => void;
  aiBlocked: boolean;
  blockMessage?: string;
  guardAiAction: () => boolean;
  aiImageStepChoice: AiImageStepChoice;
  setAiImageStepChoice: (choice: AiImageStepChoice) => void;
  aiImageStepModalCopy: string;
}

export const CulturePeopleDiscovery: React.FC<CulturePeopleDiscoveryProps> = ({
  aiContextQuery,
  setAiContextQuery,
  discoveryCount,
  setDiscoveryCount,
  isDiscovering,
  discoveryResults,
  runDiscovery,
  importDiscoveryPerson,
  removeDiscoveryResult,
  aiBlocked,
  blockMessage,
  guardAiAction,
  aiImageStepChoice,
  setAiImageStepChoice,
  aiImageStepModalCopy,
}) => {
  const discoveryBlockMessageId = 'people-discovery-ai-blocked-message';

  return (
    <div className="mb-6 p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/20">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h4 className="text-indigo-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4" aria-hidden="true" /> Deep Discovery (Gemini Pro)
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={discoveryCount}
              onChange={(e) => setDiscoveryCount(Number.parseInt(e.target.value, 10))}
              aria-label="Numero suggerimenti Discovery"
              className="w-16 min-h-11 bg-slate-950 border border-indigo-500/50 text-white text-[10px] font-bold rounded px-2 py-2 outline-none"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
            <button
              type="button"
              onClick={() => {
                if (!guardAiAction()) return;
                runDiscovery(aiContextQuery, discoveryCount);
              }}
              disabled={isDiscovering || aiBlocked}
              title={aiBlocked ? blockMessage : undefined}
              aria-describedby={aiBlocked && blockMessage ? discoveryBlockMessageId : undefined}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 min-h-11 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 disabled:opacity-50 transition-all"
            >
              {isDiscovering ? (
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              ) : (
                <Wand2 className="w-3 h-3" aria-hidden="true" />
              )}{' '}
              {aiBlocked ? 'AI off' : 'Suggerisci'}
            </button>
          </div>
        </div>
        {aiBlocked && blockMessage ? (
          <p
            id={discoveryBlockMessageId}
            className="text-[11px] text-amber-400 leading-relaxed"
            role="status"
          >
            {blockMessage}
          </p>
        ) : null}
        <fieldset className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
          <legend className="text-[10px] font-bold uppercase text-slate-400 px-1">
            Step AI immagine (Personaggio — default SI)
          </legend>
          <p className="text-[11px] text-slate-400 leading-relaxed">{aiImageStepModalCopy}</p>
          <div className="flex flex-wrap gap-2">
            {(['yes', 'no'] as const).map((choice) => {
              const active = aiImageStepChoice === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAiImageStepChoice(choice)}
                  className={`min-h-11 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {choice === 'yes' ? 'SI — genera se manca foto' : 'NO — non generare foto AI'}
                </button>
              );
            })}
          </div>
        </fieldset>
        <input
          value={aiContextQuery}
          onChange={(e) => setAiContextQuery(e.target.value)}
          aria-label="Contesto di ricerca per la scoperta automatica di personaggi famosi"
          placeholder="Cosa cerchi? (es. Pittori del 700...)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 min-h-11 text-xs text-white focus:border-indigo-500 outline-none"
        />
      </div>
      {discoveryResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {discoveryResults.map((p) => {
            const discoveryKey = p.id;
            const categoryHint =
              (p.specificCategorySlugs ?? []).join(', ') || 'Categorie da assegnare';
            return (
              <div
                key={discoveryKey}
                className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col gap-2 relative group hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-start gap-3 pr-10">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-xs truncate">{p.name}</div>
                    <div className="text-[9px] text-slate-400 truncate mb-1">{categoryHint}</div>
                    <p className="text-[9px] text-slate-500 line-clamp-3 leading-snug italic border-l border-slate-700 pl-2">
                      "{p.bio || 'Nessuna bio'}"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!guardAiAction()) return;
                    void importDiscoveryPerson(p);
                  }}
                  disabled={p.isImporting}
                  className="w-full min-h-11 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mt-auto"
                >
                  {p.isImporting ? (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="w-3 h-3" aria-hidden="true" />
                  )}
                  {p.isImporting
                    ? 'Creazione Asset...'
                    : aiImageStepChoice === 'yes'
                      ? 'Importa + Foto'
                      : 'Importa'}
                </button>
                <button
                  type="button"
                  onClick={() => removeDiscoveryResult(p.id)}
                  className="absolute top-1 right-1 inline-flex items-center justify-center min-h-11 min-w-11 text-slate-600 hover:text-white"
                  aria-label={`Rimuovi suggerimento ${p.name}`}
                  title={`Rimuovi suggerimento ${p.name}`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
