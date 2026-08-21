import {
  Activity,
  BarChart3,
  Calendar,
  Euro,
  Info,
  Loader2,
  type LucideIcon,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type AiEconomicsDailyTrendV4,
  type AiEconomicsFeatureStatV4,
  type AiEconomicsStatsV4,
  type AiEconomicsUserTypeStatV4,
  getAiEconomicsStatsV4,
} from '@/services/aiAdminService';

export const AdminAiAnalyticsV4 = () => {
  const [data, setData] = useState<AiEconomicsStatsV4 | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const payload = await getAiEconomicsStatsV4();
        if (!cancelled) {
          setData(payload);
          setErrorMessage(null);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
        if (!cancelled) {
          setData(null);
          setErrorMessage(
            err instanceof Error && err.message.trim()
              ? err.message
              : 'Impossibile caricare le statistiche AI Economics.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4 animate-pulse">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Aggregazione Big Data Economici...
        </span>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="rounded-[2.5rem] border border-rose-500/30 bg-rose-950/20 p-8 sm:p-12 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-rose-300">
          Impossibile caricare AI Economics
        </p>
        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          {errorMessage ?? 'Nessun dato disponibile.'}
        </p>
      </div>
    );
  }

  const marginPercent = data.revenue_30d > 0 ? (data.margin_30d / data.revenue_30d) * 100 : 0;
  const maxDailyCost = Math.max(...data.daily_trends.map((d) => d.cost), 0) || 1;

  return (
    <div className="space-y-8 pb-24">
      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Ricavi Totali (30d)"
          value={`€${data.revenue_30d.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          sub="Sub + Extra Credits"
          icon={Euro}
          color="indigo"
        />
        <KpiCard
          title="Costi API (30d)"
          value={`€${data.costs_30d.toLocaleString('it-IT', { minimumFractionDigits: 4 })}`}
          sub="Basato su Log Reali"
          icon={Zap}
          color="amber"
        />
        <KpiCard
          title="Margine Netto"
          value={`€${data.margin_30d.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          sub={`${marginPercent.toFixed(1)}% di redditività`}
          icon={TrendingUp}
          color={marginPercent > 30 ? 'emerald' : 'rose'}
        />
        <KpiCard
          title="Richieste AI"
          value={data.feature_stats
            .reduce((acc: number, s: AiEconomicsFeatureStatV4) => acc + s.request_count, 0)
            .toLocaleString()}
          sub="Totale ultimi 30 giorni"
          icon={Activity}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Feature Breakdown */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> Efficienza per Feature (30 Giorni)
            </h3>
            <span className="text-[10px] font-bold text-slate-500">Token Medi & Costi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="pb-4">Feature</th>
                  <th className="pb-4 text-center">Richieste</th>
                  <th className="pb-4 text-center">Token Medi</th>
                  <th className="pb-4 text-right">Costo Tot.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.feature_stats.map((s: AiEconomicsFeatureStatV4) => (
                  <tr key={s.feature_name} className="group">
                    <td className="py-4">
                      <span className="text-sm font-black text-white uppercase tracking-tight">
                        {s.feature_name}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-xs font-bold text-slate-400">{s.request_count}</span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-indigo-400">
                          {s.avg_tokens.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                          per req
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-xs font-black text-white">
                        €{s.total_cost.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Type Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> User Segmentation
            </h3>
          </div>

          <div className="space-y-6 flex-1">
            {data.user_type_stats.map((s: AiEconomicsUserTypeStatV4) => {
              const percent = data.costs_30d > 0 ? (s.total_cost / data.costs_30d) * 100 : 0;
              return (
                <div key={s.user_role} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{s.user_role}</span>
                    <span className="text-white">
                      €{s.total_cost.toFixed(2)} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${s.user_role === 'guest' ? 'bg-slate-600' : 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3 bg-indigo-500/5 p-4 rounded-2xl">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Monitora i Guest per evitare perdite API non compensate da abbonamenti o pubblicità.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" /> Trend Spesa Giornaliera (14gg)
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Costo API</span>
            </div>
          </div>
        </div>

        <div className="h-48 flex items-end gap-1.5 sm:gap-2 md:gap-4 px-1 sm:px-4 overflow-x-auto">
          {data.daily_trends.map((t: AiEconomicsDailyTrendV4) => {
            const height = (t.cost / maxDailyCost) * 100;
            const costLabel = `€${t.cost.toFixed(2)}`;
            const dateLabel = new Date(t.date).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
            });
            return (
              <div
                key={t.date}
                className="flex-1 min-w-[2.25rem] sm:min-w-0 flex flex-col items-center gap-1 group relative"
              >
                <span
                  className="text-[8px] sm:text-[9px] font-black text-slate-300 tabular-nums leading-none"
                  title={costLabel}
                >
                  {costLabel}
                </span>
                <div
                  className="w-full min-h-[4px] bg-indigo-500/20 group-hover:bg-indigo-500/40 border-t border-indigo-500/50 transition-all duration-700 rounded-t-lg"
                  style={{ height: `${height}%` }}
                  title={costLabel}
                />
                <span className="text-[7px] sm:text-[8px] font-black text-slate-600 uppercase tracking-tighter text-center leading-tight max-w-full truncate">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface KpiCardProps {
  title: string;
  value: string | undefined;
  sub: string;
  icon: LucideIcon;
  color: string;
}

const KpiCard = ({ title, value, sub, icon: Icon, color }: KpiCardProps) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-black text-white tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub}</div>
      </div>
    </div>
  );
};
