import { Check, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { getServicesConfig } from '../../../constants/services';

export interface ServiceAiResult {
  id: string;
  name: string;
  type?: string;
  contact?: string;
  category?: string;
  description?: string;
  url?: string;
  address?: string;
}

interface ServiceAiHunterProps {
  serviceTarget: string;
  onServiceTargetChange: (val: string) => void;
  discoveryCount: number;
  onDiscoveryCountChange: (val: number) => void;
  serviceQuery: string;
  onServiceQueryChange: (val: string) => void;
  discoveringServices: boolean;
  onDiscovery: () => void;
  serviceResults: ServiceAiResult[];
  onImport: (item: ServiceAiResult) => void;
  onRemoveResult: (id: string) => void;
}

export const ServiceAiHunter = ({
  serviceTarget,
  onServiceTargetChange,
  discoveryCount,
  onDiscoveryCountChange,
  serviceQuery,
  onServiceQueryChange,
  discoveringServices,
  onDiscovery,
  serviceResults,
  onImport,
  onRemoveResult,
}: ServiceAiHunterProps) => {
  const SERVICE_BOXES = getServicesConfig();

  return (
    <div className="mb-6 p-4 bg-blue-900/10 rounded-2xl border border-blue-500/20">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h4 className="text-blue-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Wand2 className="w-4 h-4" aria-hidden="true" /> AI Hunter
          </h4>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={serviceTarget}
              onChange={(e) => onServiceTargetChange(e.target.value)}
              aria-label="Target del servizio AI Hunter"
              className="bg-slate-900 border border-blue-500/30 text-white text-[10px] font-bold rounded px-2 py-2 min-h-11 outline-none w-32"
            >
              <option value="generic">Generico</option>
              {SERVICE_BOXES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <select
              value={discoveryCount}
              onChange={(e) => onDiscoveryCountChange(parseInt(e.target.value, 10))}
              aria-label="Numero di servizi da trovare"
              className="w-12 bg-slate-900 border border-blue-500/30 text-white text-[10px] font-bold rounded px-1 py-2 min-h-11 outline-none"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            <button
              type="button"
              onClick={onDiscovery}
              disabled={discoveringServices}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 min-h-11 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 disabled:opacity-50 transition-all"
            >
              {discoveringServices ? (
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="w-3 h-3" aria-hidden="true" />
              )}{' '}
              Trova
            </button>
          </div>
        </div>
        <input
          value={serviceQuery}
          onChange={(e) => onServiceQueryChange(e.target.value)}
          aria-label="Filtro opzionale per la query AI"
          placeholder="Dettaglio facoltativo (es. H24, Centrale...)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 min-h-11 text-xs text-white focus:border-blue-500 outline-none"
        />
      </div>
      {serviceResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {serviceResults.map((s) => {
            const resultKey = s.id;
            return (
              <div
                key={resultKey}
                className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col gap-2 relative group"
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs truncate">{s.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{s.type}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onImport(s)}
                  className="w-full py-1.5 min-h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" aria-hidden="true" /> Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveResult(s.id)}
                  className="absolute -top-1 -right-1 inline-flex items-center justify-center min-h-11 min-w-11 text-slate-600 hover:text-white transition-colors"
                  aria-label={`Rimuovi ${s.name} dai risultati`}
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
