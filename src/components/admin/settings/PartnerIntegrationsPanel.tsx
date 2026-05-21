import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, ExternalLink, Hash, Activity, Zap, Sparkles, ShoppingBag, ChevronRight, X } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';

export interface PartnerIntegration {
  id: string;
  label: string;
  enabled: boolean;
  capabilities: string[];
  priority?: number;
  is_primary?: boolean;
  display_options?: {
    logo_url: string;
  };
  ai_hints?: {
    prompt_trigger: string[] | string;
    preferred_for_capability?: string[];
  };
  tracking?: {
    monetization_tier: 'standard' | 'premium';
    analytics_event_name: string;
  };
  affiliate?: {
    base_url: string;
    param_name: string;
    tracking_id: string;
    search_query_param: string;
  };
  api_config?: {
    enabled: boolean;
    credentials: {
      access_key: string;
      secret_key: string;
      associate_tag: string;
      marketplace: string;
    };
  };
}

interface Props {
  configKey: string;
  data: Record<string, PartnerIntegration>;
  onSaveSuccess: () => Promise<void>;
}

export const PartnerIntegrationsPanel: React.FC<Props> = ({ configKey, data, onSaveSuccess }) => {
  const navigate = useNavigate();
  const { updateSetting } = useConfig();
  const [integrations, setIntegrations] = useState<Record<string, PartnerIntegration>>(data || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleProviderChange = (providerKey: string, fieldPath: string[], value: any) => {
    setIntegrations(prev => {
      const updated = { ...prev };
      const provider = { ...updated[providerKey] };
      
      let current: any = provider;
      for (let i = 0; i < fieldPath.length - 1; i++) {
        current[fieldPath[i]] = { ...current[fieldPath[i]] };
        current = current[fieldPath[i]];
      }
      current[fieldPath[fieldPath.length - 1]] = value;

      updated[providerKey] = provider as PartnerIntegration;
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSetting(configKey, integrations);
      await onSaveSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const providers = Object.entries(integrations || {}) as [string, PartnerIntegration][];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-white">Integrazioni Partner</h3>
          <p className="text-sm text-slate-400">Gestisci i provider di affiliazione per i suggerimenti e banner dinamici.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/affiliations')}
            className="flex items-center gap-2 px-6 py-2 bg-slate-700/50 hover:bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-sm font-bold rounded-lg transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Global Affiliate Editorial Center
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] disabled:opacity-50"
          >
            {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Modifiche
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map(([providerKey, config]) => {
          const isPremium = config.tracking?.monetization_tier === 'premium';
          const isWarning = config.enabled && (!config.affiliate?.tracking_id);
          const trackingId = config.affiliate?.tracking_id || '';
          
          let previewUrl = '';
          if (config.affiliate?.base_url && config.affiliate?.param_name) {
            try {
              if (providerKey === 'amazon') {
                 let bUrl = config.affiliate.base_url;
                 if (bUrl.includes('/s')) bUrl = bUrl.replace('/s', '');
                 if (bUrl.endsWith('/')) bUrl = bUrl.slice(0, -1);
                 previewUrl = `${bUrl}/dp/EXAMPLE_ASIN?${config.affiliate.param_name}=${trackingId || 'YOUR_TAG'}`;
              } else {
                 const u = new URL(config.affiliate.base_url);
                 u.searchParams.set(config.affiliate.param_name, trackingId || 'YOUR_ID');
                 previewUrl = u.toString();
              }
            } catch (e) {
              previewUrl = 'Invalid base URL';
            }
          }

          return (
            <div key={providerKey} className={`relative flex flex-col bg-slate-900 border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 transform ${config.enabled ? 'border-slate-600 shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:-translate-y-1' : 'border-slate-800 opacity-60 grayscale-[0.5]'}`}>
              <div className="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700/50">
                  <div className="flex items-center gap-6">
                     <div className="h-14 min-w-[100px] px-3 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-600 shadow-sm">
                        {config.display_options?.logo_url ? (
                          <img 
                            src={config.display_options.logo_url.startsWith('http') || config.display_options.logo_url.startsWith('/') ? config.display_options.logo_url : `/${config.display_options.logo_url}`} 
                            alt="" 
                            className="max-h-10 w-auto object-contain p-1" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-icon flex items-center justify-center';
                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-slate-800"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-800" />
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-white font-black text-lg capitalize tracking-tight leading-tight">{providerKey}</h4>
                       <div className="flex items-center flex-wrap gap-1 mt-1">
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-sm font-black tracking-widest ${isPremium ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}`}>
                            {config.tracking?.monetization_tier || 'standard'}
                          </span>
                          {config.capabilities?.map(cap => (
                            <span key={cap} className="text-[9px] bg-slate-800/80 border border-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{cap}</span>
                          ))}
                       </div>
                     </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                     <input 
                       type="checkbox" 
                       className="sr-only peer" 
                       checked={config.enabled} 
                       onChange={(e) => handleProviderChange(providerKey, ['enabled'], e.target.checked)}
                     />
                     <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                  </label>
              </div>

              <div className="p-5 flex-1 space-y-5">
                 {isWarning && (
                   <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-red-300">
                        <strong className="block text-red-200">Tracking ID Mancante</strong>
                        Provider abilitato ma nessun Affiliate ID/Tag configurato. I link non traccieranno le vendite.
                      </div>
                   </div>
                 )}

                 <div>
                   <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                     <Hash className="w-3.5 h-3.5 text-indigo-400" /> Tracking / Affiliate ID
                   </label>
                   <input
                     type="text"
                     placeholder="es. tag-21 o ref12345"
                     value={trackingId}
                     onChange={(e) => handleProviderChange(providerKey, ['affiliate', 'tracking_id'], e.target.value)}
                     className="w-full bg-slate-950/50 border border-slate-700 text-indigo-200 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600 shadow-inner"
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Trigger AI
                      </label>
                      <input
                        type="text"
                        value={(() => {
                            const pt = config.ai_hints?.prompt_trigger;
                            if (Array.isArray(pt)) return pt.join(', ');
                            if (typeof pt === 'string') return pt;
                            return '';
                        })()}
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          handleProviderChange(providerKey, ['ai_hints', 'prompt_trigger'], arr);
                        }}
                        placeholder="es. shopping"
                        className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" /> Event Name
                      </label>
                      <input
                        type="text"
                        value={config.tracking?.analytics_event_name || ''}
                        onChange={(e) => handleProviderChange(providerKey, ['tracking', 'analytics_event_name'], e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                    </div>
                 </div>

                 {providerKey === 'amazon' && (
                    <div className="pt-4 mt-2 border-t border-slate-800 space-y-4">
                       <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5" /> Amazon PA-API Config
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={config.api_config?.enabled || false} 
                              onChange={(e) => handleProviderChange(providerKey, ['api_config', 'enabled'], e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
                          </label>
                       </div>

                       {config.api_config?.enabled && (
                         <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                               <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Access Key</label>
                               <input
                                 type="password"
                                 value={config.api_config.credentials.access_key}
                                 onChange={(e) => handleProviderChange(providerKey, ['api_config', 'credentials', 'access_key'], e.target.value)}
                                 className="w-full bg-slate-950/50 border border-slate-800 text-[10px] text-indigo-200 p-2 rounded focus:border-indigo-500/50 focus:outline-none"
                               />
                            </div>
                            <div>
                               <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Secret Key</label>
                               <input
                                 type="password"
                                 value={config.api_config.credentials.secret_key}
                                 onChange={(e) => handleProviderChange(providerKey, ['api_config', 'credentials', 'secret_key'], e.target.value)}
                                 className="w-full bg-slate-950/50 border border-slate-800 text-[10px] text-indigo-200 p-2 rounded focus:border-indigo-500/50 focus:outline-none"
                               />
                            </div>
                         </div>
                       )}
                    </div>
                 )}

                 <div className="pt-4 border-t border-slate-800">
                    <p className="text-[9px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Routing (Readonly)</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="col-span-3 bg-slate-900 border border-slate-800 p-2 rounded text-slate-500 truncate font-mono" title={config.affiliate?.base_url}>
                         <strong className="text-slate-600 text-[9px] block uppercase mb-1">Base</strong>
                         {config.affiliate?.base_url || 'N/D'}
                      </div>
                      <div className="col-span-1 bg-slate-900 border border-slate-800 p-2 rounded text-slate-500 truncate font-mono" title={config.affiliate?.param_name}>
                         <strong className="text-slate-600 text-[9px] block uppercase mb-1">Param</strong>
                         {config.affiliate?.param_name || '?'}
                      </div>
                    </div>
                    
                    <div className="mt-2 bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between group cursor-help">
                       <div className="truncate text-[10px] text-slate-400 font-mono pr-2 transition-colors group-hover:text-indigo-400">
                         {previewUrl}
                       </div>
                       <ExternalLink className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
