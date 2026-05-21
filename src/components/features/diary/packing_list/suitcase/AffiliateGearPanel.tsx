import React from 'react';
import { ShoppingBag, ExternalLink } from 'lucide-react';

interface AffiliateGearPanelProps {
  gear: any[];
  isLoading: boolean;
  onLinkBuild: (provider: string, url: string) => string;
}

export const AffiliateGearPanel: React.FC<AffiliateGearPanelProps> = ({
  gear,
  isLoading,
  onLinkBuild
}) => {
  if (gear.length === 0 && !isLoading) return null;

  return (
    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
          <ShoppingBag className="w-3.5 h-3.5" />
        </div>
        <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Acquisti consigliati</h5>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
            <div className="py-4 text-center">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            </div>
        ) : (
            gear.map((item, idx) => (
                <a
                  key={idx}
                  href={onLinkBuild(item.provider, item.affiliate_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-300 truncate group-hover:text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.provider_label || item.provider}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                </a>
            ))
        )}
      </div>
      <p className="text-[9px] text-slate-600 text-center italic">Link sponsorizzati. Acquistando potresti sostenere Touring Diary.</p>
    </div>
  );
};
