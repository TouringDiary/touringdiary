import { CONTENT_REPORT_STATUS_LABELS } from '@/constants/governance';

const LEGEND_ITEMS = [
  {
    status: 'nuovo' as const,
    dotClass: 'bg-amber-500',
    description: 'Segnalazione ricevuta; sospensione automatica già applicata dove previsto.',
  },
  {
    status: 'in_verifica' as const,
    dotClass: 'bg-indigo-400',
    description: 'In lavorazione admin; transizione verso OK o KO.',
  },
  {
    status: 'ok' as const,
    dotClass: 'bg-emerald-500',
    description: 'Chiusura amministrativa; la segnalazione resta archiviata.',
  },
  {
    status: 'ko' as const,
    dotClass: 'bg-rose-500',
    description: 'Segnalazione respinta; ripristino entità/assignment se previsto.',
  },
] as const;

export const ReportsStatusLegend = () => (
  <section
    className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
    aria-labelledby="reports-status-legend-heading"
  >
    <h2
      id="reports-status-legend-heading"
      className="text-xs font-bold uppercase tracking-wider text-slate-400"
    >
      Legenda stati segnalazione
    </h2>
    <ul className="grid gap-2 sm:grid-cols-2">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.status} className="flex gap-2 text-xs text-slate-400">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dotClass}`} aria-hidden />
          <span>
            <strong className="text-slate-200">{CONTENT_REPORT_STATUS_LABELS[item.status]}</strong>
            {' — '}
            {item.description}
          </span>
        </li>
      ))}
    </ul>
    <p className="text-[10px] text-slate-500 leading-relaxed">
      Stati <strong className="text-slate-400">segnalazione</strong> (NUOVO / IN VERIFICA / OK / KO)
      sono distinti da stati <strong className="text-slate-400">entità</strong> (es. PUBLISHED /
      SUSPENDED) e da stati <strong className="text-slate-400">assignment/foto</strong> (active /
      suspended).
    </p>
  </section>
);
